import { NextResult } from "../@types/types"
import checkType from "../utils/checkType"
import { traverseList, traverseString } from "../utils/traverse"

export default class NextParser {
	public static parse(data: any): NextResult {
            const playlistData = traverseString(data, "playlistPanelVideoRenderer");

		return checkType(
			{
                        index: +traverseString(playlistData, "navigationEndpoint", "index"),
				name: traverseString(playlistData, "title", "text"),
				artist: traverseString(playlistData, "longBylineText", "text"),
                        playlistId: traverseString(playlistData, "navigationEndpoint", "playlistId"),
				videoId: traverseString(playlistData, "videoId"),
                        selected: traverseString(playlistData, "selected") === "true",
                        params: traverseString(playlistData, "navigationEndpoint", "params"),
				thumbnails: traverseList(playlistData, "thumbnails")
			},
			NextResult,
		)
	}
}
