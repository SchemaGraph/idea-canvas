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


declare module "@reach/router" {
  class Router extends React.Component<any> {

  }
  class Link extends React.Component<any> {

  }
  class Redirect extends React.Component<any> {

  }

  function navigate(to: string, options?: {state?: any, replace?: boolean});
}

declare module "grommet-icons" {
  const Actions: string;
  const ClosedCaption: string;
  const Expand: string;
  const FormDown: string;
  const FormNext: string;
  const FormPrevious: string;
  const FormUp: string;
  const Next: string;
  const Pause: string;
  const Play: string;
  const Previous: string;
  const Subtract: string;
  const Volume: string;
  const VolumeLow: string;
}


