import React from 'react';
import PagerView, { PagerViewProps } from 'react-native-pager-view';

const PagerViewWrapper = React.forwardRef<PagerView, PagerViewProps>((props, ref) => {
    return <PagerView {...props} ref={ref} />;
});

export type PagerViewType = PagerView;
export default PagerViewWrapper;
