# ============================================================================
# SAFE DEAD-CODE STRIPPING CONFIGURATION (NO OBFUSCATION, NO BYTECODE MUTATION)
# ============================================================================

# 1. Nonaktifkan pengacakan nama class & method (100% aman dari masalah reflection)
-dontobfuscate
-dontoptimize
-dontwarn

# 2. Pertahankan semua Annotation, Signature Generics, dan Inner Classes
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# ============================================================================
# KEEP NATIVE MODULES & LIBRARIES
# ============================================================================

# React Native Core, JNI, Hermes & Yoga
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }

# React Navigation & Screens
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native SVG & Charts
-keep class com.horcrux.svg.** { *; }

# React Native Image Picker & Resizer
-keep class com.imagepicker.** { *; }
-keep class fr.bamlab.rnimageresizer.** { *; }

# React Native Blob Util & FS
-keep class com.ReactNativeBlobUtil.** { *; }
-keep class com.rnfs.** { *; }

# React Native BootSplash
-keep class com.zoontek.rnbootsplash.** { *; }

# React Native Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# React Native Geolocation & Device Info
-keep class com.agontuk.RNFusedLocation.** { *; }
-keep class com.learnium.RNDeviceInfo.** { *; }

# React Native Community Components
-keep class com.reactcommunity.rndatetimepicker.** { *; }
-keep class com.reactnativecommunity.picker.** { *; }
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native Share
-keep class cl.json.** { *; }

# Networking (OkHttp / Okio)
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep native methods across all classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep serializable / parcelable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
