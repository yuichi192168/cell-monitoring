'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Access Denied: You don't have permission to ${context.operation} this record.
    
Location: ${context.path}
Action: ${context.operation}

Please contact your Primary Leader if you believe this is an error.`;
    super(message);
    this.name = 'Permission Error';
    this.context = context;
  }
}
