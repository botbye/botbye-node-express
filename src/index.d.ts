import { type TModuleApi } from "@botbye/node-core";
import { type Request } from "express";
type TFactoryOptions = {
    module?: {
        name?: string;
        version?: string;
    };
};
declare const factory: (options?: TFactoryOptions) => TModuleApi<Request>;
declare const init: (options: import("@botbye/node-core").TInitOptions) => void, evaluate: (event: {
    type: "full";
    request: {
        ip: string;
        headers: Record<string, string>;
        token?: import("@botbye/node-core").TNullable<string>;
        requestMethod?: import("@botbye/node-core").TNullable<string>;
        requestUri?: import("@botbye/node-core").TNullable<string>;
    } | {
        request: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        token?: import("@botbye/node-core").TNullable<string>;
    };
    event: {
        type: string;
        status: import("@botbye/node-core").TUpstreamEventStatus;
    };
    user: {
        accountId: string;
        username?: import("@botbye/node-core").TNullable<string>;
        email?: import("@botbye/node-core").TNullable<string>;
        phone?: import("@botbye/node-core").TNullable<string>;
    };
    customFields?: {
        [x: string]: string;
    };
} | {
    type: "risk";
    request: {
        ip: string;
        token?: import("@botbye/node-core").TNullable<string>;
        requestMethod?: import("@botbye/node-core").TNullable<string>;
        requestUri?: import("@botbye/node-core").TNullable<string>;
        headers?: import("@botbye/node-core").TRequestInfo["headers"];
    } | {
        request: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        token?: import("@botbye/node-core").TNullable<string>;
    };
    event: {
        type: string;
        status: import("@botbye/node-core").TUpstreamEventStatus;
    };
    user: {
        accountId: string;
        username?: import("@botbye/node-core").TNullable<string>;
        email?: import("@botbye/node-core").TNullable<string>;
        phone?: import("@botbye/node-core").TNullable<string>;
    };
    customFields?: {
        [x: string]: string;
    };
    botbyeResult?: string;
} | {
    type: "validate";
    request: {
        ip: string;
        headers: Record<string, string>;
        token?: import("@botbye/node-core").TNullable<string>;
        requestMethod?: import("@botbye/node-core").TNullable<string>;
        requestUri?: import("@botbye/node-core").TNullable<string>;
    } | {
        request: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
        token?: import("@botbye/node-core").TNullable<string>;
    };
    customFields?: {
        [x: string]: string;
    };
}) => Promise<import("@botbye/node-core").TEvaluationResult>, dev: {
    setLoggerLevel(level: import("@botbye/node-core").TLoggerLevel): void;
    sendInitCall(): void;
    getLogger(): import("@botbye/node-core").TLogger;
};
export { init, evaluate, dev, factory, };
export { phishing, phishingFactory, } from "./phishing";
export type * from "@botbye/node-core";
