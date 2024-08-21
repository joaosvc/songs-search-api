import express from "express";
import { ParsedQs } from "qs";

export interface HttpResponse<T> {
  statusCode: HttpStatusCode;
  body: T;
}

export interface HttpRequest<B> {
  params?: Record<string, string> | ParsedQs;
  headers?: Record<string, string>;
  body?: B;
}

export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  SERVER_ERROR = 500,
}

export interface IController {
  handle(
    httpRequest: HttpRequest<unknown>,
    request?: express.Request,
    response?: express.Response
  ): Promise<HttpResponse<unknown>>;
}
