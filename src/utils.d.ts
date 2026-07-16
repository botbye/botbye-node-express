import { type TRequestInfo, type TRequestInfoExtractor } from "@botbye/node-core";
import { type Request } from "express";
declare const requestInfoExtractor: TRequestInfoExtractor<Request, TRequestInfo>;
export { requestInfoExtractor, };
