import { AudioFormatsMetadata } from "../../@types/types";
import AudioFormats from "../../models/audio-formats";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetAudioFormatsParams } from "./protocols";

export class GetAudioFormatsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetAudioFormatsParams>
  ): Promise<HttpResponse<AudioFormatsMetadata | string>> {
    try {
      const requiredFields: (keyof GetAudioFormatsParams)[] = ["url"];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetAudioFormatsParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const metadata = await AudioFormats.fromUrl(httpRequest.body.url);

      return ok<AudioFormatsMetadata>(metadata);
    } catch (error) {
      if (error instanceof Error) {
        return badRequest(error.message);
      } else {
        console.error(error);
        return serverError();
      }
    }
  }
}
