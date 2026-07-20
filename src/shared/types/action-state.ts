export interface ActionState {
    ok: boolean;
    message: string;
}

export const initialActionState: ActionState = {
    ok: false,
    message: ""
};
