package in.nightwise.demo;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.ViewCompat;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(MapsHandoffPlugin.class);
        registerPlugin(MapViewportPlugin.class);
        registerPlugin(DeviceSettingsPlugin.class);
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View content = findViewById(android.R.id.content);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.BLACK));
        content.setBackgroundColor(android.graphics.Color.BLACK);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            // Keep controls outside the camera cutout and keyboard while letting
            // the background occupy the whole screen. System bars are transient.
            androidx.core.graphics.Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            androidx.core.graphics.Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(cutout.left, cutout.top, cutout.right, Math.max(cutout.bottom, keyboard.bottom));
            // This container owns IME spacing. Do not apply it again in children.
            return WindowInsetsCompat.CONSUMED;
        });
        immersive();
    }
    private void immersive() {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }
}
