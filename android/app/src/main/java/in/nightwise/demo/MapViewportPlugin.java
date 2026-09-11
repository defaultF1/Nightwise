package in.nightwise.demo;
import android.graphics.Rect;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.ViewGroup;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="MapViewport")
public class MapViewportPlugin extends Plugin {
    @PluginMethod public void background(PluginCall call) {
        String color=call.getString("color", "");
        if(!color.matches("#[0-9a-fA-F]{6}")){call.reject("Invalid background color");return;}
        getActivity().runOnUiThread(()->{
            int value=Color.parseColor(color);
            // The WebView is transparent around a native map. Match the layers
            // beneath it to the app theme without painting over the map itself.
            getActivity().getWindow().setBackgroundDrawable(new ColorDrawable(value));
            getActivity().findViewById(android.R.id.content).setBackgroundColor(value);
            ((View)getBridge().getWebView().getParent()).setBackgroundColor(value);
            call.resolve();
        });
    }
    @PluginMethod public void clip(PluginCall call) {
        String id=call.getString("id", "");
        if(!id.matches("nightwise-[0-9]+")){call.reject("Invalid map reference");return;}
        getActivity().runOnUiThread(()->{
            ViewGroup root=(ViewGroup)getBridge().getWebView().getParent();
            View view=root.findViewWithTag(id);
            if(view!=null){
                float scale=getContext().getResources().getDisplayMetrics().density;
                int left=Math.round(call.getFloat("left",0f)*scale),top=Math.round(call.getFloat("top",0f)*scale);
                int right=Math.round(call.getFloat("right",0f)*scale),bottom=Math.round(call.getFloat("bottom",0f)*scale);
                // Clip the outer native container, preserving the full map's
                // coordinate origin and the plugin's existing touch offsets.
                view.setClipBounds(new Rect(left,top,Math.max(left,right),Math.max(top,bottom)));
                view.setVisibility(right>left&&bottom>top?View.VISIBLE:View.INVISIBLE);
            }
            call.resolve();
        });
    }
}
