import type { Request } from 'express';
import type { TBotByeResponse } from 'botbye-node-core'

export function init(serverKey: string): typeof validateRequest;

export function validateRequest(token: string, request: Request, customFields?: string[]): Promise<TBotByeResponse>;
