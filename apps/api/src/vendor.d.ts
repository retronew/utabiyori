declare module '@neteasecloudmusicapienhanced/api/util/crypto.js' {
  const encrypt: {
    weapi(data: Record<string, unknown>): Record<string, string>
  }
  export default encrypt
}
