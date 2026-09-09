package in.nightwise.demo;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(MapsHandoffPlugin.class);
        super.onCreate(state);
    }
}
