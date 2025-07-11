var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import * as snabbdom from 'snabbdom';
const h = snabbdom.h;
/**
 * View definitions for statemachine diagram elements
 */
export var StatemachineViews;
(function (StatemachineViews) {
    /**
     * StateMachine view
     */
    let StateMachineView = class StateMachineView {
        render(model, context) {
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
    };
    StateMachineView = __decorate([
        injectable()
    ], StateMachineView);
    StatemachineViews.StateMachineView = StateMachineView;
    /**
     * State view
     */
    let StateView = class StateView {
        render(model, context) {
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
                }, model.name || 'State')
            ]);
        }
    };
    StateView = __decorate([
        injectable()
    ], StateView);
    StatemachineViews.StateView = StateView;
    /**
     * Transition view
     */
    let TransitionView = class TransitionView {
        render(model, context) {
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
    };
    TransitionView = __decorate([
        injectable()
    ], TransitionView);
    StatemachineViews.TransitionView = TransitionView;
})(StatemachineViews || (StatemachineViews = {}));
//# sourceMappingURL=statemachine-views.js.map