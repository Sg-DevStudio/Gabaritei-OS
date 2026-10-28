package br.com.gabaritei.os;

import android.app.*;
import android.content.*;
import android.os.Build;

final class Alarms {
    static final int TIMER = 11, RETURN = 12;
    static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences("notifications", Context.MODE_PRIVATE); }
    static void channels(Context c) {
        NotificationManager n = c.getSystemService(NotificationManager.class);
        n.createNotificationChannel(new NotificationChannel("timer", "Término do tempo", NotificationManager.IMPORTANCE_HIGH));
        n.createNotificationChannel(new NotificationChannel("return", "Retomar os estudos", NotificationManager.IMPORTANCE_DEFAULT));
    }
    static PendingIntent pending(Context c, int id) {
        return PendingIntent.getBroadcast(c, id, new Intent(c, AlarmReceiver.class).setAction("alarm." + id), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    static void cancel(Context c, int id) {
        c.getSystemService(AlarmManager.class).cancel(pending(c, id));
        prefs(c).edit().remove("at." + id).remove("body." + id).apply();
        c.getSystemService(NotificationManager.class).cancel(id);
    }
    static void schedule(Context c, int id, long at, String body) {
        if (!prefs(c).getBoolean(id == TIMER ? "timer" : "return", false)) { cancel(c, id); return; }
        long old = prefs(c).getLong("at." + id, 0);
        if (Math.abs(old - at) < 1500) return;
        prefs(c).edit().putLong("at." + id, at).putString("body." + id, body).apply();
        AlarmManager a = c.getSystemService(AlarmManager.class);
        try {
            if (id == TIMER && (Build.VERSION.SDK_INT < 31 || a.canScheduleExactAlarms()))
                a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(c, id));
            else a.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(c, id));
        } catch (SecurityException revoked) {
            a.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(c, id));
        }
    }
    static void markOpened(Context c) {
        cancel(c, RETURN);
        prefs(c).edit().putLong("lastOpened", System.currentTimeMillis()).apply();
        java.util.Calendar when = java.util.Calendar.getInstance();
        when.add(java.util.Calendar.DAY_OF_YEAR, prefs(c).getInt("days", 3));
        if (when.get(java.util.Calendar.HOUR_OF_DAY) >= 22) { when.add(java.util.Calendar.DAY_OF_YEAR, 1); when.set(java.util.Calendar.HOUR_OF_DAY, 8); }
        else if (when.get(java.util.Calendar.HOUR_OF_DAY) < 8) when.set(java.util.Calendar.HOUR_OF_DAY, 8);
        schedule(c, RETURN, when.getTimeInMillis(), "Que tal reservar alguns minutos para seu próximo estudo? Continue no seu ritmo.");
    }
    static void restore(Context c) {
        for (int id : new int[]{TIMER, RETURN}) {
            long at = prefs(c).getLong("at." + id, 0);
            String body = prefs(c).getString("body." + id, "Seu tempo terminou.");
            prefs(c).edit().remove("at." + id).apply();
            if (at > System.currentTimeMillis()) schedule(c, id, at, body);
        }
    }
}
