import { VNode } from 'snabbdom';
import { RenderingContext, IView, SNodeImpl } from 'sprotty';
/**
 * View definitions for statemachine diagram elements
 */
export declare namespace StatemachineViews {
    /**
     * StateMachine view
     */
    class StateMachineView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode;
    }
    /**
     * State view
     */
    class StateView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode;
    }
    /**
     * Transition view
     */
    class TransitionView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode;
    }
}
//# sourceMappingURL=statemachine-views.d.ts.map