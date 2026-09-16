package in.nightwise.demo;

import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.content.pm.PackageManager;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MapsHandoff")
public class MapsHandoffPlugin extends Plugin {
    private boolean installed(String packageName) {
        try { return getContext().getPackageManager().getApplicationInfo(packageName, 0).enabled; }
        catch (PackageManager.NameNotFoundException missing) { return false; }
    }
    @PluginMethod public void available(PluginCall call) {
        JSArray apps = new JSArray();
        if (installed("com.google.android.apps.maps")) apps.put("google");
        if (installed("com.mmi.maps")) apps.put("mappls");
        JSObject result = new JSObject(); result.put("apps", apps); call.resolve(result);
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
                if (Boolean.TRUE.equals(call.getBoolean("browserOnly", false))) {
                    getActivity().startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    call.resolve(); return;
                }
                if (!installed(mappls ? "com.mmi.maps" : "com.google.android.apps.maps")) {
                    call.reject("This navigation app is no longer installed. Choose another app."); return;
                }
                if (mappls) {
                    // Mappls' own website uses this native route link, including
                    // origin, ordered via points, destination and mode. Do not
                    // replace it with geo:, which would discard the journey.
                    Uri nativeRoute = new Uri.Builder().scheme("mapmyindia").authority("navigation")
                        .encodedQuery(uri.getEncodedQuery()).build();
                    try {
                        getActivity().startActivity(new Intent(Intent.ACTION_VIEW, nativeRoute).setPackage("com.mmi.maps"));
                        call.resolve(); return;
                    } catch (ActivityNotFoundException unsupportedDeepLink) {
                        // Preserve the complete directions URL in the fallback.
                    }
                }
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.setPackage(mappls ? "com.mmi.maps" : "com.google.android.apps.maps");
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception unavailable) { call.reject("No app could open the Maps preview."); }
        });
    }
}
