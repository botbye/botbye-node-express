import type { TBotByeInitOptions, TBotByeResponse, TValidateRequestOptions as TValidateRequestOptionsCore } from 'botbye-node-core';

export function init(options: TBotByeInitOptions): typeof validateRequest;

export type TValidateRequestOptions = Omit<TValidateRequestOptionsCore, "requestInfo" | "headers"> & {
    request: Request
}


export function validateRequest(options: TValidateRequestOptions): Promise<TBotByeResponse>;
