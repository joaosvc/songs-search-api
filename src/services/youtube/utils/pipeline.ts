import { MinigetError } from "miniget";
import { PipelineEndpoint, RetryOptions } from "../@types/types";
import { YoutubeUnrecoverableError } from "../error/unrecoverable-error";
import FilterPlayerResponse from "../filter/player-response";

/**
 * Like Object.assign(), but ignores `null` and `undefined` from `source`.
 *
 * @param {Object} target
 * @param {Object} source
 */
export const assign = (target: any, source: any) => {
  if (!target || !source) {
    return target || source;
  }
  for (let [key, value] of Object.entries(source)) {
    if (value !== null && value !== undefined) {
      target[key] = value;
    }
  }
  return target;
};

/**
 * Given a function, calls it with `args` until it's successful,
 * or until it encounters an unrecoverable error.
 * Currently, any error from miniget is considered unrecoverable. Errors such as
 * too many redirects, invalid URL, status code 404, status code 502.
 *
 * @param {Function} func
 * @param {Array.<Object>} args
 * @param {Object} options
 * @param {number} options.maxRetries
 * @param {Object} options.backoff
 * @param {number} options.backoff.inc
 */
const retryFunc = async (
  func: (...args: any[]) => Promise<any>,
  args: any[],
  options: RetryOptions
) => {
  let currentTry = 0,
    result;
  while (currentTry <= options.maxRetries) {
    try {
      result = await func(...args);
      break;
    } catch (err: any) {
      if (
        err instanceof YoutubeUnrecoverableError ||
        (err instanceof MinigetError && err.statusCode! < 500) ||
        currentTry >= options.maxRetries
      ) {
        throw err;
      }
      let wait = Math.min(
        ++currentTry * options.backoff.inc,
        options.backoff.max
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  return result;
};

/**
 * Goes through each endpoint in the pipeline, retrying on failure if the error is recoverable.
 * If unable to succeed with one endpoint, moves onto the next one.
 *
 * @param {Array.<Object>} args
 * @param {Function} validate
 * @param {Object} retryOptions
 * @param {Array.<Function>} endpoints
 * @returns {[Object, Object, Object]}
 */
export const pipeline = async (
  args: any[],
  retryOptions: RetryOptions,
  endpoints: PipelineEndpoint[]
): Promise<any> => {
  let info: any;

  for (const func of endpoints) {
    try {
      const newInfo = await retryFunc(func, args.concat([info]), retryOptions);

      if (newInfo.player_response) {
        newInfo.player_response.videoDetails = assign(
          info && info.player_response && info.player_response.videoDetails,
          newInfo.player_response.videoDetails
        );
        newInfo.player_response = assign(
          info && info.player_response,
          newInfo.player_response
        );
      }
      info = assign(info, newInfo);

      if (FilterPlayerResponse.validate(info)) {
        break;
      }
    } catch (err) {
      if (
        err instanceof YoutubeUnrecoverableError ||
        func === endpoints[endpoints.length - 1]
      ) {
        throw err;
      }
      // Unable to find video metadata... so try next endpoint.
    }
  }
  return info;
};
