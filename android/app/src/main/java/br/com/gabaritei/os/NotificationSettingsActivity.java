package br.com.gabaritei.os;
import android.app.*;
import android.os.*;
import android.widget.*;
import android.content.*;
import android.net.Uri;
import android.provider.Settings;
public class NotificationSettingsActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout l = new LinearLayout(this); l.setOrientation(LinearLayout.VERTICAL); l.setPadding(36,64,36,36);
        TextView title = new TextView(this); title.setText("Notificações Android"); title.setTextSize(25); l.addView(title);
        Switch timer = new Switch(this); timer.setText("Avisar ao terminar o tempo"); timer.setChecked(Alarms.prefs(this).getBoolean("timer", false)); l.addView(timer);
        Switch ret = new Switch(this); ret.setText("Convidar a voltar após alguns dias"); ret.setChecked(Alarms.prefs(this).getBoolean("return", false)); l.addView(ret);
        TextView daysLabel = new TextView(this); daysLabel.setText("Dias sem abrir o app (3, 5 ou 7)"); l.addView(daysLabel);
        Spinner days = new Spinner(this); days.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, new String[]{"3 dias", "5 dias", "7 dias"}));
        int value = Alarms.prefs(this).getInt("days",3); days.setSelection(value == 7 ? 2 : value == 5 ? 1 : 0); l.addView(days);
        TextView info = new TextView(this); info.setText("Lembretes são opcionais, sem repetição diária e fora de 22h–8h. Alarmes podem atrasar conforme as permissões e a economia de bateria. Volte ao app após reiniciar o celular para conferir o timer."); l.addView(info);
        Button permission = new Button(this); permission.setText("Permitir notificações"); permission.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},31);
            else startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));
        }); l.addView(permission);
        Button exact = new Button(this); exact.setText("Configurar precisão do alarme"); exact.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= 31) startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getPackageName())));
        }); l.addView(exact);
        Button save = new Button(this); save.setText("Salvar e voltar"); save.setOnClickListener(v -> {
            Alarms.prefs(this).edit().putBoolean("timer",timer.isChecked()).putBoolean("return",ret.isChecked()).putInt("days",new int[]{3,5,7}[days.getSelectedItemPosition()]).apply();
            if (!timer.isChecked()) Alarms.cancel(this,Alarms.TIMER);
            Alarms.markOpened(this); finish();
        }); l.addView(save); setContentView(l);
    }
}
