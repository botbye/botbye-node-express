import { type TPhishingModuleApi } from "@botbye/node-core";
import { type Request } from "express";
type TPhishingFactoryOptions = {
    module?: {
        name?: string;
        version?: string;
    };
};
declare const phishingFactory: (options?: TPhishingFactoryOptions) => TPhishingModuleApi<Request>;
declare const phishing: TPhishingModuleApi<Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>>;
export { phishing, phishingFactory, };
