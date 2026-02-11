
export const getIconName = (icon: string | null | undefined): any => {
    if (!icon) return 'help-circle-outline';

    const mapping: Record<string, string> = {
        'shopping-bag': 'bag',
        'bag': 'bag',
        'utensils': 'restaurant',
        'utensil-spoon': 'restaurant',
        'food': 'restaurant',
        'tree': 'leaf',
        'trees': 'leaf',
        'sightseeing': 'camera',
        'viewpoint': 'camera',
        'culture': 'ribbon',
        'information': 'information-circle',
        'transport': 'car',
        'shopping': 'cart',
        'hotel': 'bed',
        'stay': 'bed',
        'nightlife': 'wine',
        'beach': 'sunny',
        'hiking': 'walk',
        'directions': 'navigate',
    };

    const name = icon.toLowerCase().trim();
    return mapping[name] || name;
};
