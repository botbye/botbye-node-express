import { Request } from "express";
import { TBotByeInitOptions, TBotByeResponse, TValidateRequestOptions as TValidateRequestOptionsCore } from "botbye-node-core";
declare function init(options: TBotByeInitOptions): typeof validateRequest;
type TValidateRequestOptions = Omit<TValidateRequestOptionsCore, "requestInfo" | "headers"> & {
    request: Request;
};
declare function validateRequest(options: TValidateRequestOptions): Promise<TBotByeResponse>;
export { type TValidateRequestOptions, type TBotByeResponse, init, validateRequest, };
