declare const graphql: (query: TemplateStringsArray) => void;

declare module 'lz-string' {
  function compressToBase64(input: string): string;
  function decompressFromBase64(input: string): string;

  function compressToUTF16(input: string): string;
  function decompressFromUTF16(compressed: string): string;

  function compressToUint8Array(uncompressed: string): Uint8Array;
  function decompressFromUint8Array(compressed: Uint8Array): string;

  function compressToEncodedURIComponent(input: string): string;
  function decompressFromEncodedURIComponent(compressed: string): string;

  function compress(input: string): string;
  function decompress(compressed: string): string;
}

declare module 'amazon-cognito-auth-js' {
  class CognitoAuth {
    constructor(p: any);
    public userhandler?: {
      onSuccess: (session: any) => void;
      onFailure: (error: any) => void;
    };
    public parseCognitoWebResponse(response: string): void;
    public getSession(): any;
    public signOut(): void;
    public isUserSignedIn(): boolean;
    public getSignInUserSession(): any;
  }
}

