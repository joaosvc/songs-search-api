import { InfoOptions } from "../@types/types";
import { Script as VMScript } from "vm";
import { VideoFormat } from "../@types/types";
import { exposedMiniget } from "./mineget";
import { between } from "../../../utils/between";
import { cutAfterJSON } from "../../../utils/json-parser";
import QueryString from "querystring";
import Cache from "./cache";

const cache = new Cache(30000);

export const extractFunctions = (body: string) => {
  const functions: string[] = [];

  const extractManipulations = (caller: string) => {
    const functionName = between(caller, `a=a.split("");`, `.`);
    if (!functionName) return "";
    const functionStart = `var ${functionName}={`;
    const ndx = body.indexOf(functionStart);
    if (ndx < 0) return "";
    const subBody = body.slice(ndx + functionStart.length - 1);
    return `var ${functionName}=${cutAfterJSON(subBody)}`;
  };

  const extractDecipher = () => {
    const functionName = between(
      body,
      `a.set("alr","yes");c&&(c=`,
      `(decodeURIC`
    );
    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        let functionBody = `var ${functionStart}${cutAfterJSON(subBody)}`;
        functionBody = `${extractManipulations(
          functionBody
        )};${functionBody};${functionName}(sig);`;
        functions.push(functionBody);
      }
    }
  };

  const extractNCode = () => {
    let functionName = between(body, `&&(b=a.get("n"))&&(b=`, `(b)`);
    if (functionName.includes("["))
      functionName = between(body, `var ${functionName.split("[")[0]}=[`, `]`);

    if (functionName && functionName.length) {
      const functionStart = `${functionName}=function(a)`;
      const ndx = body.indexOf(functionStart);
      if (ndx >= 0) {
        const subBody = body.slice(ndx + functionStart.length);
        const functionBody = `var ${functionStart}${cutAfterJSON(
          subBody
        )};${functionName}(ncode);`;
        functions.push(functionBody);
      }
    }
  };

  extractDecipher();
  extractNCode();

  return functions;
};

export const getFunctions = async (
  html5playerfile: string,
  options: InfoOptions
) => {
  return cache.getOrSet(html5playerfile, async () => {
    const body = await exposedMiniget(html5playerfile, options).text();
    const functions = extractFunctions(body);
    if (!functions || !functions.length) {
      throw Error("Could not extract functions");
    }
    return functions;
  });
};

export const decipherFormats = async (
  formats: VideoFormat[],
  html5player: string,
  options: InfoOptions
) => {
  let decipheredFormats: { [url: string]: VideoFormat } = {};
  let functions = await getFunctions(html5player, options);

  const decipherScript = functions.length ? new VMScript(functions[0]) : null;
  const nTransformScript =
    functions.length > 1 ? new VMScript(functions[1]) : null;

  formats.forEach((format) => {
    setDownloadURL(format, decipherScript, nTransformScript);
    decipheredFormats[format.url] = format;
  });

  return decipheredFormats;
};

export const setDownloadURL = (
  format: any,
  decipherScript: VMScript | null,
  nTransformScript: VMScript | null
) => {
  const decipher = (url: any) => {
    const args: any = QueryString.parse(url);

    if (!args.s || !decipherScript) {
      return args.url;
    }

    const components = new URL(decodeURIComponent(args.url));

    components.searchParams.set(
      args.sp ? args.sp : "signature",
      decipherScript.runInNewContext({ sig: decodeURIComponent(args.s) })
    );
    return components.toString();
  };

  const ncode = (url: string) => {
    const components = new URL(decodeURIComponent(url));
    const n = components.searchParams.get("n");
    if (!n || !nTransformScript) return url;
    components.searchParams.set(
      "n",
      nTransformScript.runInNewContext({ ncode: n })
    );
    return components.toString();
  };
  const cipher = !format.url;
  const url = format.url || format.signatureCipher || format.cipher;
  format.url = cipher ? ncode(decipher(url)) : ncode(url);

  delete format.signatureCipher;
  delete format.cipher;
};
