import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({address:vi.fn(),position:vi.fn(),permissions:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true},registerPlugin:()=>({address:mocks.address})}));
vi.mock('@capacitor/geolocation',()=>({Geolocation:{getCurrentPosition:mocks.position,requestPermissions:mocks.permissions}}));
// These cases exercise Android's address provider, independent of local .env files.
vi.mock('../../src/providers/selection',()=>({usesGeoapify:false}));
import{currentLocation}from'../../src/native';
beforeEach(()=>{vi.clearAllMocks();mocks.permissions.mockResolvedValue({location:'granted'});mocks.position.mockResolvedValue({timestamp:Date.now(),coords:{latitude:26.48,longitude:80.30,accuracy:15}});});
it('shows a resolved address without replacing GPS coordinates',async()=>{mocks.address.mockResolvedValue({address:'Test address, Kanpur'});expect(await currentLocation()).toMatchObject({latitude:26.48,longitude:80.30,address:'Approximate address: Test address, Kanpur'});});
it('retains the accurate GPS start if the address provider fails',async()=>{mocks.address.mockRejectedValue(new Error('unavailable'));expect(await currentLocation()).toMatchObject({name:'Current location',latitude:26.48,longitude:80.30,address:'GPS accuracy about 15 m · confirm the starting entrance'});});
it('does not request GPS or an address after permission is refused',async()=>{mocks.permissions.mockResolvedValue({location:'denied',coarseLocation:'denied'});await expect(currentLocation()).rejects.toThrow('declined');expect(mocks.position).not.toHaveBeenCalled();expect(mocks.address).not.toHaveBeenCalled();});
