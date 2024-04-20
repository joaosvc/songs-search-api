import {
  SearchAlbumsResultMetadata,
  SearchResultMetadata,
} from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetSearchSongsParams } from "./protocols";
import Parser from "../../utils/parser";

export class GetSearchSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetSearchSongsParams>
  ): Promise<
    HttpResponse<SearchResultMetadata | SearchAlbumsResultMetadata | string>
  > {
    try {
      const requiredFields: (keyof GetSearchSongsParams)[] = ["searchQuery"];

      for (const field of requiredFields) {
        if (!httpRequest?.body?.[field as keyof GetSearchSongsParams]) {
          return badRequest(`Field ${field} is required`);
        }
      }

      const { searchQuery, offset, limit } = httpRequest.body!;

      const metadata = await Parser.searchSongs(searchQuery, offset, limit);

      return ok<SearchResultMetadata | SearchAlbumsResultMetadata>(metadata);
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
