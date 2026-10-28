package br.com.gabaritei.os;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
public class AlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent intent) {
        int id = "alarm.11".equals(intent.getAction()) ? Alarms.TIMER : Alarms.RETURN;
        if (!Alarms.prefs(c).getBoolean(id == Alarms.TIMER ? "timer" : "return", false)) return;
        long scheduled = Alarms.prefs(c).getLong("at." + id, 0);
        if (scheduled == 0 || scheduled > System.currentTimeMillis() + 1000) return;
        String body = Alarms.prefs(c).getString("body." + id, "Seu tempo terminou.");
        if (id == Alarms.RETURN) {
            java.util.Calendar now = java.util.Calendar.getInstance();
            int hour = now.get(java.util.Calendar.HOUR_OF_DAY);
            if (hour >= 22 || hour < 8) {
                if (hour >= 22) now.add(java.util.Calendar.DAY_OF_YEAR, 1);
                now.set(java.util.Calendar.HOUR_OF_DAY, 8); now.set(java.util.Calendar.MINUTE, 0);
                Alarms.schedule(c, id, now.getTimeInMillis(), body); return;
            }
        }
        Alarms.prefs(c).edit().remove("at." + id).remove("body." + id).apply();
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return;
        Alarms.channels(c);
        PendingIntent open = PendingIntent.getActivity(c, id, new Intent(c, MainActivity.class).putExtra("timer", id == Alarms.TIMER), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(c, id == Alarms.TIMER ? "timer" : "return")
            .setSmallIcon(R.drawable.notification_icon).setContentTitle(id == Alarms.TIMER ? "Tempo concluído" : "Seu próximo passo está aqui")
            .setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(open).build();
        c.getSystemService(NotificationManager.class).notify(id, n);
    }
}
