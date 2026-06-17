/**
 * Backend — aws-blocks/index.ts
 * Marketplace AI - Base limpia
 */
import { ApiNamespace, Scope } from '@aws-blocks/blocks';

const scope = new Scope('my-app');

export const api = new ApiNamespace(scope, 'api', (context) => ({
  async ping() {
    return { message: 'AWS Blocks funcionando', timestamp: Date.now() };
  },
}));
