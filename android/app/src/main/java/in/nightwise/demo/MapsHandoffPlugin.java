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
        String host = uri.getHost() == null ? "" : uri.getHost();
        if (!"https".equals(uri.getScheme()) || !("mappls.com".equals(host) || "www.mappls.com".equals(host)) || !"/direction".equals(uri.getPath())) {
            call.reject("Only Mappls direction previews can be opened."); return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                // Prefer the installed Mappls app; otherwise any browser shows the same preview.
                intent.setPackage("com.mmi.maps");
                try { getActivity().startActivity(intent); }
                catch (ActivityNotFoundException missingMappls) {
                    intent.setPackage(null); getActivity().startActivity(intent);
                }
                call.resolve();
            } catch (Exception unavailable) { call.reject("No app could open the Mappls preview."); }
        });
    }
}
