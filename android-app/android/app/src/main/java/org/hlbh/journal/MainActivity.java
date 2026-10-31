package org.hlbh.journal;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View contentView;
    private WindowInsetsControllerCompat insetsController;
    private WebView webView;
    private boolean themeBridgeRegistered;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        contentView = findViewById(android.R.id.content);

        applyTheme("light");

        ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout()
            );
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(contentView);

        registerThemeBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        registerThemeBridge();
    }

    private void registerThemeBridge() {
        if (themeBridgeRegistered || bridge == null || bridge.getWebView() == null) {
            return;
        }
        webView = bridge.getWebView();
        webView.addJavascriptInterface(new ThemeBridge(), "HLBHTheme");
        themeBridgeRegistered = true;
    }

    private void applyTheme(String theme) {
        boolean halloween = "halloween".equals(theme);
        boolean dark = halloween || "dark".equals(theme);
        int background = Color.parseColor(
                halloween ? "#160F1C" : dark ? "#0D161A" : "#F7FBFD"
        );

        getWindow().setStatusBarColor(background);
        getWindow().setNavigationBarColor(background);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().setNavigationBarDividerColor(background);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(!dark);
            insetsController.setAppearanceLightNavigationBars(!dark);
        }

        if (contentView != null) {
            contentView.setBackgroundColor(background);
        }
        if (webView != null) {
            webView.setBackgroundColor(background);
        }
    }

    private class ThemeBridge {
        @JavascriptInterface
        public void setTheme(String theme) {
            if (!"light".equals(theme) && !"dark".equals(theme) && !"halloween".equals(theme)) {
                return;
            }
            runOnUiThread(() -> applyTheme(theme));
        }
    }

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
            bridge.getWebView().goBack();
        } else {
            super.onBackPressed();
        }
    }
}
