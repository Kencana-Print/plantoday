import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type LoadingSkeletonProps = {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  color?: string;
  shimmerColor?: string;
  shimmerDuration?: number;
};

function LoadingSkeletonBase({
  width = '100%',
  height,
  borderRadius = 8,
  style,
  color = 'rgba(148,163,184,0.25)',
  shimmerColor = 'rgba(255,255,255,0.5)',
  shimmerDuration = 1200,
}: LoadingSkeletonProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: shimmerDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [shimmerDuration, shimmerValue]);

  const translateX = useMemo(
    () =>
      shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-140, 260],
      }),
    [shimmerValue],
  );

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor: color },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.shimmerTrack, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', shimmerColor, 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

export const LoadingSkeleton = memo(LoadingSkeletonBase);

type ListSkeletonProps = {
  rows?: number;
  cardColor?: string;
  lineColor?: string;
};

function ListSkeletonBase({
  rows = 4,
  cardColor = '#F8FAFC',
  lineColor = 'rgba(148,163,184,0.22)',
}: ListSkeletonProps) {
  const items = Array.from({ length: rows }, (_, i) => i);

  return (
    <View style={styles.wrap}>
      {items.map(item => (
        <View
          key={`skeleton-${item}`}
          style={[styles.card, { backgroundColor: cardColor }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.leftCol}>
              <LoadingSkeleton height={10} width={44} color={lineColor} />
              <LoadingSkeleton
                height={15}
                width="80%"
                color={lineColor}
                style={styles.mt6}
              />
              <LoadingSkeleton
                height={13}
                width="68%"
                color={lineColor}
                style={styles.mt6}
              />
              <LoadingSkeleton
                height={12}
                width="92%"
                color={lineColor}
                style={styles.mt6}
              />
            </View>
            <View style={styles.rightCol}>
              <LoadingSkeleton height={10} width={38} color={lineColor} />
              <LoadingSkeleton
                height={12}
                width={78}
                color={lineColor}
                style={styles.mt6}
              />
              <LoadingSkeleton
                height={12}
                width={82}
                color={lineColor}
                style={styles.mt6}
              />
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <LoadingSkeleton height={10} width="60%" color={lineColor} />
              <LoadingSkeleton
                height={12}
                width="70%"
                color={lineColor}
                style={styles.mt6}
              />
            </View>
            <View style={styles.statusChip}>
              <LoadingSkeleton height={10} width="60%" color={lineColor} />
              <LoadingSkeleton
                height={12}
                width="70%"
                color={lineColor}
                style={styles.mt6}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export const ListSkeleton = memo(ListSkeletonBase);

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmerTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  wrap: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftCol: { flex: 1 },
  rightCol: { width: 90, alignItems: 'flex-end' },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
  },
  mt6: { marginTop: 6 },
});
