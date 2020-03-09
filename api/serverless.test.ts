import { NowRequest, NowResponse } from '@now/node';

export default (req: NowRequest, res: NowResponse) => {
  res.json({ name: 'Foo', email: 'bar@foobar.foo' })
}
