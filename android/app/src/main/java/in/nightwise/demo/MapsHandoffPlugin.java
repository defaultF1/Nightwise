package in.nightwise.demo;

import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MapsHandoff")
public class MapsHandoffPlugin extends Plugin {
    @PluginMethod public void open(PluginCall call) {
        String value = call.getString("url", "");
        Uri uri = Uri.parse(value);
        if (!"https".equals(uri.getScheme()) || !"www.google.com".equals(uri.getHost()) || !"/maps/dir/".equals(uri.getPath())) {
            call.reject("Only Google Maps direction previews can be opened."); return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.setPackage("com.google.android.apps.maps");
                try { getActivity().startActivity(intent); }
                catch (ActivityNotFoundException missingMaps) {
                    intent.setPackage(null); getActivity().startActivity(intent);
                }
                call.resolve();
            } catch (Exception unavailable) { call.reject("No app could open the Maps preview."); }
        });
    }
}
