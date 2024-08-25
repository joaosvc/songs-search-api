import axios from "axios";
import { between } from "../src/utils/between";
import { cutAfterJSON } from "../src/utils/json-parser";
import { Script as VMScript } from "vm";
import { getInfo } from "ytdl-core";

const extractFunctions = (body: string) => {
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

class YouTubeExtractor {
  public async getPlayerUrl(): Promise<string | null> {
    try {
      const res = await axios.get("https://www.youtube.com/iframe_api");
      const playerVersion = (res.data.match(
        /player\\?\/([0-9a-fA-F]{8})\\?\//
      ) || [])[1];
      return playerVersion
        ? `https://www.youtube.com/s/player/${playerVersion}/player_ias.vflset/en_US/base.js`
        : null;
    } catch (error) {
      console.error("Erro ao obter a URL do player:", error);
      return null;
    }
  }

  public async loadPlayer(playerUrl: string): Promise<string> {
    try {
      const response = await axios.get(playerUrl);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to load player`);
    }
  }

  private searchRegex(
    data: string,
    regex: RegExp,
    groupName: string
  ): number | undefined {
    const match = data.match(regex);

    if (match && match[1]) {
      return parseInt(match[1], 10);
    } else {
      throw new Error(`Could not find ${groupName} in the provided data`);
    }
  }

  public async extractSignatureTimestamp(
    code: string
  ): Promise<number | undefined> {
    const regex = /(?:signatureTimestamp|sts)\s*:\s*([0-9]{5})/;
    return this.searchRegex(code, regex, "JS player signature timestamp");
  }

  private searchRegexSig(
    data: string,
    regexes: RegExp[],
    groupName: string
  ): string {
    for (const regex of regexes) {
      const match = data.match(regex);

      if (match) {
        return match[1];
      }
    }
    throw new Error(`Could not find ${groupName} in the provided data`);
  }

  public async parseSigJs(jscode: string) {
    const regexes = [
      /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
      /\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
      /\bm=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(h\.s\)\)/,
      /\bc&&\(c=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(c\)\)/,
      /(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)(?:;[a-zA-Z0-9$]{2}\.[a-zA-Z0-9$]{2}\(a,\d+\))?/,
      /([a-zA-Z0-9$]+)\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)/,
      // Patterns obsoletos
      /("|\')signature\1\s*,\s*([a-zA-Z0-9$]+)\(/,
      /\.sig\|\|([a-zA-Z0-9$]+)\(/,
      /yt\.akamaized\.net\/\)\s*\|\|\s*.*?\s*[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?:encodeURIComponent\s*\()?\s*([a-zA-Z0-9$]+)\(/,
      /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
      /\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
      /\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/,
    ];
    const funcName = this.searchRegexSig(
      jscode,
      regexes,
      "Initial JS player signature function name"
    );

    const functions = extractFunctions(jscode);

    if (!functions || !functions.length) {
      throw Error("Could not extract functions");
    }

    return functions;
  }
}

(async () => {
  const extractSignatureAndUrl = (
    input: string
  ): { signature: string | null; url: string | null } => {
    const regex = /s=([^&]+)&sp=sig&url=([^&]+)/;
    const match = input.match(regex);

    if (match) {
      return {
        signature: decodeURIComponent(match[1]),
        url: decodeURIComponent(match[2]),
      };
    }

    return {
      signature: null,
      url: null,
    };
  };

  try {
    const extractor = new YouTubeExtractor();
    const signatureCipher = `s=zzJfuJfQdSswRQIhAOWVakdnZIAWXejHMbHt5YFm8sLVuZj1SzcRRzMa3mGmAiBHavXRoWrIQ9e9Yr-fC_pPVROog3mf683tcRKyGXEj%3DA%3Dv&sp=sig&url=https://rr2---sn-hvcuxaxjvh-4vgs.googlevideo.com/videoplayback%3Fexpire%3D1724622141%26ei%3D3VDLZtypNpqX-LAP1anVgQ0%26ip%3D177.190.211.187%26id%3Do-AMvndONmIOMk7p5DrJNejyo1Pl-vmSCpxXQfEt3GmYtU%26itag%3D251%26source%3Dyoutube%26requiressl%3Dyes%26xpc%3DEgVo2aDSNQ%253D%253D%26mh%3Dh5%26mm%3D31%252C29%26mn%3Dsn-hvcuxaxjvh-4vgs%252Csn-pmcg-4vgl%26ms%3Dau%252Crdu%26mv%3Dm%26mvi%3D2%26pl%3D26%26gcr%3Dbr%26initcwndbps%3D1151250%26bui%3DAQmm2ewRJaOU3BKTcxCaIH1mOKR8VnKNGvxgkVNQ0e3sl4uIEwsvUTQrbSZfNuT-Tadxs17LoKqEVSuY%26spc%3DMv1m9kXetCnHYZVXjYo7-Lj8GOTROHVtAExIoSlGW43z0C287L4eTO9gXci0%26vprv%3D1%26svpuc%3D1%26mime%3Daudio%252Fwebm%26ns%3Dg7lpZT99-Vu2PXKSigh7VDYQ%26rqh%3D1%26gir%3Dyes%26clen%3D2759421%26dur%3D160.821%26lmt%3D1714909872881718%26mt%3D1724600219%26fvip%3D2%26keepalive%3Dyes%26c%3DWEB_REMIX%26sefc%3D1%26txp%3D4432434%26n%3DkOgvvKjcuvHgYazo%26sparams%3Dexpire%252Cei%252Cip%252Cid%252Citag%252Csource%252Crequiressl%252Cxpc%252Cgcr%252Cbui%252Cspc%252Cvprv%252Csvpuc%252Cmime%252Cns%252Crqh%252Cgir%252Cclen%252Cdur%252Clmt%26lsparams%3Dmh%252Cmm%252Cmn%252Cms%252Cmv%252Cmvi%252Cpl%252Cinitcwndbps%26lsig%3DAGtxev0wRgIhAIrdBBCpbBkiZbBTZHnpE6fbdvo4m_leJiLrV9RNsG_zAiEA4y-A-_6yKecNR9pd-bqGEolPU0pITA92_3oYfr4h4WU%253D`;
    const { signature, url } = extractSignatureAndUrl(signatureCipher);

    if (!signature || !url) {
      throw new Error("No signature or url found");
    }

    const playerUrl = await extractor.getPlayerUrl();

    if (!playerUrl) {
      return console.error("Não foi possível obter a URL do player");
    }
    const code = await extractor.loadPlayer(playerUrl);

    const signatureTimestamp = await extractor.extractSignatureTimestamp(code);
    const functions = await extractor.parseSigJs(code);

    const decipherScript = functions.length ? new VMScript(functions[0]) : null;
    // const nTransformScript =
    //   functions.length > 1 ? new VMScript(functions[1]) : null;

    const decipheredSig = decipherScript?.runInNewContext({ sig: signature });
    //const decipheredN = nTransformScript?.runInNewContext({ ncode });

    // console.log({
    //   playerUrl,
    //   signatureTimestamp,
    //   decipheredSig,
    //   functions,
    // });

    //console.log(`${url}&sig=${decipheredSig}`);

    getInfo("https://music.youtube.com/watch?v=xYjFxFFdyyk").then((info) => {
      console.log(info);
    });
  } catch (error: any) {
    console.error("Erro:", error.message);
  }
})();
