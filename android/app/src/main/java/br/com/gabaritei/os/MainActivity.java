package br.com.gabaritei.os;

import android.app.Activity;
import android.os.Bundle;
import android.content.*;
import android.net.Uri;
import android.widget.*;
import androidx.browser.customtabs.*;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import org.json.JSONObject;

/** Uses the installed browser for Google login and the existing PWA data. */
public class MainActivity extends Activity {
    static final String HOME = "https://sg-devstudio.github.io/Gabaritei-OS/";
    static final Uri ORIGIN = Uri.parse("https://sg-devstudio.github.io");
    private CustomTabsSession session;
    private CustomTabsServiceConnection connection;
    private boolean validated, loaded;
    private final CustomTabsCallback callback = new CustomTabsCallback() {
        @Override public void onRelationshipValidationResult(int relation, Uri origin, boolean result, Bundle extras) {
            if (relation == CustomTabsService.RELATION_USE_AS_ORIGIN && ORIGIN.equals(origin)) {
                validated = result; connectChannel();
            }
        }
        @Override public void onNavigationEvent(int event, Bundle extras) {
            if (event == NAVIGATION_STARTED) loaded = false;
            if (event == NAVIGATION_FINISHED) { loaded = true; connectChannel(); }
        }
        @Override public void onMessageChannelReady(Bundle extras) {
            session.postMessage("gabaritei-native-ready", null);
        }
        @Override public void onPostMessage(String message, Bundle extras) {
            if (!validated || message == null || message.length() > 2048) return;
            try {
                JSONObject data = new JSONObject(message);
                String type = data.optString("type");
                if (type.equals("settings")) startActivity(new Intent(MainActivity.this, NotificationSettingsActivity.class));
                if (type.equals("opened")) Alarms.markOpened(MainActivity.this);
                if (type.equals("cancelTimer")) Alarms.cancel(MainActivity.this, Alarms.TIMER);
                if (type.equals("timer")) {
                    long at = data.optLong("at");
                    if (at > System.currentTimeMillis() && at < System.currentTimeMillis() + 172800000L)
                        Alarms.schedule(MainActivity.this, Alarms.TIMER, at, data.optString("body", "Seu tempo de estudo terminou."));
                }
            } catch (Exception ignored) { /* Reject malformed bridge messages. */ }
        }
    };
    private void connectChannel() {
        if (validated && loaded && session != null) session.requestPostMessageChannel(ORIGIN, ORIGIN, new Bundle());
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        Alarms.channels(this); Alarms.markOpened(this);
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setPadding(40,80,40,40);
        TextView title = new TextView(this); title.setText("Gabaritei OS"); title.setTextSize(28); layout.addView(title);
        TextView info = new TextView(this); info.setText("Seus estudos, no seu ritmo.\nO app usa seu navegador para manter o login seguro."); layout.addView(info);
        Button open = new Button(this); open.setText("Abrir meus estudos"); open.setOnClickListener(v -> openBrowser()); layout.addView(open);
        Button settings = new Button(this); settings.setText("Notificações Android"); settings.setOnClickListener(v -> startActivity(new Intent(this, NotificationSettingsActivity.class))); layout.addView(settings);
        setContentView(layout); openBrowser();
    }
    private void openBrowser() {
        if (session != null) { launch(); return; }
        String provider = CustomTabsClient.getPackageName(this, null);
        if (provider == null) { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(HOME))); return; }
        connection = new CustomTabsServiceConnection() {
            @Override public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                client.warmup(0); session = client.newSession(callback);
                if (session == null) return;
                session.validateRelationship(CustomTabsService.RELATION_USE_AS_ORIGIN, ORIGIN, null);
                launch();
            }
            @Override public void onServiceDisconnected(ComponentName name) { session = null; validated = false; }
        };
        if (!CustomTabsClient.bindCustomTabsService(this, provider, connection))
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(HOME)));
    }
    private void launch() {
        new TrustedWebActivityIntentBuilder(Uri.parse(HOME + (getIntent().getBooleanExtra("timer", false) ? "#timer" : ""))).build(session).launchTrustedWebActivity(this);
    }
    @Override protected void onDestroy() {
        if (connection != null) { try { unbindService(connection); } catch (Exception ignored) {} }
        super.onDestroy();
    }
}
