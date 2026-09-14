package in.nightwise.demo;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.location.Geocoder;
import com.getcapacitor.JSObject;
import java.util.Locale;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {
    @PluginMethod public void installationStamp(PluginCall call) {
        try {
            var info=getContext().getPackageManager().getPackageInfo(getContext().getPackageName(),0);
            JSObject result=new JSObject();
            result.put("stamp",info.firstInstallTime+":"+info.lastUpdateTime);
            call.resolve(result);
        } catch(Exception error) { call.reject("Could not identify this installation."); }
    }
    // Android 10's synchronous geocoder must run off the UI thread.
    @PluginMethod public void address(PluginCall call) {
        Double latitude=call.getDouble("latitude"), longitude=call.getDouble("longitude");
        if(latitude==null||longitude==null||!Double.isFinite(latitude)||!Double.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){call.reject("Invalid location");return;}
        new Thread(()->{
            JSObject result=new JSObject();
            try {
                if(Geocoder.isPresent()) {
                    var addresses=new Geocoder(getContext(),Locale.ENGLISH).getFromLocation(latitude,longitude,1);
                    if(addresses!=null&&!addresses.isEmpty()) {
                        String line=addresses.get(0).getAddressLine(0);
                        if(line!=null&&!line.trim().isEmpty())result.put("address",line.substring(0,Math.min(250,line.length())));
                    }
                }
            } catch(Exception ignored) { /* A missing address must not discard a valid GPS fix. */ }
            call.resolve(result);
        },"NightWise-address").start();
    }
    @PluginMethod public void openLocation(PluginCall call) { open(call, new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); }
    @PluginMethod public void openApp(PluginCall call) { open(call, new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:"+getContext().getPackageName()))); }
    private void open(PluginCall call, Intent intent) {
        getActivity().runOnUiThread(()->{try{getActivity().startActivity(intent);call.resolve();}catch(Exception error){call.reject("Settings could not be opened.");}});
    }
}
