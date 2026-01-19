import React, { useImperativeHandle, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const PagerViewWeb = React.forwardRef((props: any, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
        setPage: (index: number) => {
            scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
        },
    }));

    return (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                if (props.onPageSelected) {
                    props.onPageSelected({ nativeEvent: { position: index } });
                }
            }}
            style={[styles.container, props.style]}
        >
            {React.Children.map(props.children, (child) => (
                <View style={{ width }}>{child}</View>
            ))}
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default PagerViewWeb;
