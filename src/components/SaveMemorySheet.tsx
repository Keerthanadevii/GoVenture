import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryChips } from './CategoryChips';

interface SaveMemorySheetProps {
    sheetRef: any;
    onSave: (category: string, caption: string) => void;
    colors: any;
    categories?: string[];
    count?: number;
    initialCategory?: string;
    isSaving?: boolean;
}

export const SaveMemorySheet: React.FC<SaveMemorySheetProps> = ({
    sheetRef,
    onSave,
    colors,
    categories = [],
    count = 1,
    initialCategory,
    isSaving = false
}) => {
    const snapPoints = useMemo(() => ['50%', '80%'], []);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || (categories.length > 0 ? categories[0] : 'All'));
    const [caption, setCaption] = useState('');

    React.useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    const handleSave = () => {
        if (isSaving) return;
        onSave(selectedCategory, caption);
        setCaption(''); // Clear after save
    };

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: colors.card }}
            handleIndicatorStyle={{ backgroundColor: colors.divider }}
        >
            <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Save {count > 1 ? `${count} Memories` : 'Memory'}</Text>

                <Text style={[styles.label, { color: colors.textSecondary }]}>CHOOSE FOLDER</Text>
                <View style={styles.chipsWrapper}>
                    <CategoryChips
                        categories={categories.length > 0 ? categories : ['All', 'Favorites', 'Food', 'Scenery']}
                        activeCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        colors={colors}
                        ScrollComponent={BottomSheetScrollView}
                    />
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>ADD CAPTION (OPTIONAL)</Text>
                <BottomSheetTextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.divider }]}
                    placeholder={count > 1 ? "Add a common caption..." : "Describe this moment..."}
                    placeholderTextColor={colors.textSecondary}
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save {count > 1 ? `${count} Photos` : 'Memory'}</Text>
                    )}
                </TouchableOpacity>

                {/* Extra space for stability in scroll */}
                <View style={{ height: 40 }} />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 10,
    },
    chipsWrapper: {
        marginLeft: -20,
        marginRight: -20,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        borderWidth: 1,
    },
    saveBtn: {
        marginTop: 30,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
