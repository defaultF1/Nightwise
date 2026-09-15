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
    // Let Android list every installed maps app for the destination and let the
    // user pick. A geo: URI carries only the destination, never a full route.
    @PluginMethod public void chooser(PluginCall call) {
        Double latitude = call.getDouble("latitude");
        Double longitude = call.getDouble("longitude");
        String name = call.getString("name", "Destination");
        if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            call.reject("A valid destination is required."); return;
        }
        String point = latitude + "," + longitude;
        Uri uri = Uri.parse("geo:" + point + "?q=" + point + "(" + Uri.encode(name) + ")");
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().startActivity(Intent.createChooser(new Intent(Intent.ACTION_VIEW, uri), "Navigate with"));
                call.resolve();
            } catch (Exception unavailable) { call.reject("No installed app could open this destination."); }
        });
    }
    @PluginMethod public void open(PluginCall call) {
        String value = call.getString("url", "");
        Uri uri = Uri.parse(value);
        boolean google = "www.google.com".equals(uri.getHost()) && "/maps/dir/".equals(uri.getPath());
        boolean mappls = "mappls.com".equals(uri.getHost()) && "/direction".equals(uri.getPath());
        if (!"https".equals(uri.getScheme()) || uri.getUserInfo() != null || uri.getPort() != -1 || !(google || mappls)) {
            call.reject("Only supported navigation previews can be opened."); return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.setPackage(mappls ? "com.mmi.maps" : "com.google.android.apps.maps");
                try { getActivity().startActivity(intent); }
                catch (ActivityNotFoundException missingMaps) {
                    intent.setPackage(null); getActivity().startActivity(intent);
                }
                call.resolve();
            } catch (Exception unavailable) { call.reject("No app could open the Maps preview."); }
        });
    }
}
