export class FetcherError extends Error {
  public name = 'FetcherError'

  public response: Response

  constructor(resp: Response) {
    super()
    this.response = resp
  }
}
