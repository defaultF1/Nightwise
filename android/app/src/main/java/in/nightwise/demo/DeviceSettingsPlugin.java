package in.nightwise.demo;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {
    @PluginMethod public void openLocation(PluginCall call) { open(call, new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); }
    @PluginMethod public void openApp(PluginCall call) { open(call, new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:"+getContext().getPackageName()))); }
    private void open(PluginCall call, Intent intent) {
        getActivity().runOnUiThread(()->{try{getActivity().startActivity(intent);call.resolve();}catch(Exception error){call.reject("Settings could not be opened.");}});
    }
}
