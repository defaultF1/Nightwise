import {test,expect,vi} from 'vitest';
import {createGeoapifyServer} from '../../server/geoapify-app';
import {Geoapify} from '../../server/geoapify';

test('high-resolution tiles preserve geographic coverage and reject invalid scale and zoom',async()=>{
 const request=vi.spyOn(Geoapify.prototype,'request').mockResolvedValue(new Uint8Array([137,80,78,71]));
 const app=await createGeoapifyServer('unused-test-key');
 try{
  const response=await app.inject('/api/tiles/dark-matter/20/750000/480000?scale=2');
  expect(response.statusCode).toBe(200);
  expect(request.mock.calls[0][0]).toBe('/v1/tile/dark-matter/20/750000/480000@2x.png');
  expect(response.headers['content-type']).toContain('image/png');
  for(const url of ['/api/tiles/dark-matter/21/1/1?scale=2','/api/tiles/dark-matter/1/2/1?scale=2','/api/tiles/dark-matter/15/1/1?scale=100'])expect((await app.inject(url)).statusCode).toBe(400);
  expect(request).toHaveBeenCalledTimes(1);
 }finally{await app.close();request.mockRestore();}
});
