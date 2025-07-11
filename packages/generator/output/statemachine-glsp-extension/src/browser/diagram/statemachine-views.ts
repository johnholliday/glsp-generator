import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { RenderingContext, IView, SModelElementImpl, SNodeImpl } from 'sprotty';
import * as snabbdom from 'snabbdom';

const h = snabbdom.h;

/**
 * View definitions for statemachine diagram elements
 */
export namespace StatemachineViews {

    /**
     * StateMachine view
     */
    @injectable()
    export class StateMachineView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode {
            const bounds = model.bounds || { x: 0, y: 0, width: 100, height: 60 };
            
            // Default rendering for other nodes
            return h('g', {
                attrs: {
                    class: 'statemachine-node'
                }
            }, [
                h('rect', {
                    attrs: {
                        x: 0,
                        y: 0,
                        width: bounds.width,
                        height: bounds.height
                    },
                    style: {
                        fill: '#E0E0E0',
                        stroke: '#999999',
                        strokeWidth: '1px'
                    }
                }),
                h('text', {
                    attrs: {
                        x: bounds.width / 2,
                        y: bounds.height / 2,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle'
                    },
                    style: {
                        fill: '#333333',
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }, model.type || 'StateMachine')
            ]);
        }
    }
    /**
     * State view
     */
    @injectable()
    export class StateView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode {
            const bounds = model.bounds || { x: 0, y: 0, width: 100, height: 60 };
            
            // Special rendering for State nodes
            return h('g', {
                attrs: {
                    class: 'state-node'
                }
            }, [
                h('rect', {
                    attrs: {
                        x: 0,
                        y: 0,
                        width: bounds.width,
                        height: bounds.height,
                        rx: 10,
                        ry: 10
                    },
                    style: {
                        fill: '#4A90E2',
                        stroke: '#2E5C8A',
                        strokeWidth: '2px'
                    }
                }),
                h('text', {
                    attrs: {
                        x: bounds.width / 2,
                        y: bounds.height / 2,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle'
                    },
                    style: {
                        fill: 'white',
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }, (model as any).name || 'State')
            ]);
        }
    }
    /**
     * Transition view
     */
    @injectable()
    export class TransitionView implements IView {
        render(model: SNodeImpl, context: RenderingContext): VNode {
            const bounds = model.bounds || { x: 0, y: 0, width: 100, height: 60 };
            
            // Default rendering for other nodes
            return h('g', {
                attrs: {
                    class: 'transition-node'
                }
            }, [
                h('rect', {
                    attrs: {
                        x: 0,
                        y: 0,
                        width: bounds.width,
                        height: bounds.height
                    },
                    style: {
                        fill: '#E0E0E0',
                        stroke: '#999999',
                        strokeWidth: '1px'
                    }
                }),
                h('text', {
                    attrs: {
                        x: bounds.width / 2,
                        y: bounds.height / 2,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle'
                    },
                    style: {
                        fill: '#333333',
                        fontSize: '12px',
                        fontFamily: 'Arial, sans-serif'
                    }
                }, model.type || 'Transition')
            ]);
        }
    }
}