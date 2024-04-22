import { SimpleLinkMetadata } from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetSimpleLinkParams } from "./protocols";
import YoutubeSearch from "../../models/youtube-search";

export class GetSimpleLinkController implements IController {
  async handle(
    httpRequest: HttpRequest<GetSimpleLinkParams>
  ): Promise<HttpResponse<SimpleLinkMetadata | string>> {
    try {
      const requiredFields: (keyof GetSimpleLinkParams)[] = [
        "name",
        "album",
        "songId",
        "url",
        "artist",
        "artists",
        "isrc",
        "duration",
      ];

      if (!httpRequest?.body) {
        return badRequest("Request body is required");
      }

      for (const field of requiredFields) {
        if (!((field as keyof GetSimpleLinkParams) in httpRequest?.body)) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const metadata = await YoutubeSearch.fromParams(httpRequest.body!);

      return ok<SimpleLinkMetadata>(metadata);
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
