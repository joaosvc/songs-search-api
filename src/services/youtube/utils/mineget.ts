import Miniget from "miniget";
import { InfoOptions } from "../@types/types";

export const exposedMiniget = (
  url: string,
  options: InfoOptions = {},
  requestOptionsOverwrite?: Miniget.Options
) => {
  const req = Miniget(url, requestOptionsOverwrite || options.requestOptions);

  console.log(url);
  if (typeof options.requestCallback === "function")
    options.requestCallback(req);
  return req;
};
