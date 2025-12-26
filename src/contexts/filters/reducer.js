import { initialFilters, emptyFilters } from "./initialStateFilters";

export function filtersReducer(state, action) {
  switch (action.type) {
    /* ========= DRAFT (UI only) ========= */

    case "SET_ITEMS":
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.key]: state.draft[action.key].includes(action.value)
            ? state.draft[action.key].filter((v) => v !== action.value)
            : [...state.draft[action.key], action.value],
        },
      };

    case "SET_ITEM":
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.key]: action.value,
        },
      };

    case "RESET_ONE":
      return {
        ...state,
        draft: {
          ...state.draft,
          [action.key]: emptyFilters[action.key],
        },
      };

    case "RESET_ALL":
      return {
        ...state,
        draft: emptyFilters,
      };

    /* ========= APPLY ========= */

    case "APPLY_FILTERS": //
      return {
        ...state,
        applied: state.draft,
      };

    /* ========= DIRECT APPLY (no button) ========= */

    case "SET_ITEM_APPLY":
      return {
        draft: {
          ...state.draft,
          [action.key]: action.value,
        },
        applied: {
          ...state.applied,
          [action.key]: action.value,
        },
      };

    case "RESET_ONE_APPLY": //
      return {
        draft: {
          ...state.draft,
          [action.key]: emptyFilters[action.key],
        },
        applied: {
          ...state.applied,
          [action.key]: emptyFilters[action.key],
        },
      };

    case "RESET_ALL_APPLY": //
      return initialFilters;

    /* ========= URL / SSR ========= */

    case "HYDRATE_FROM_URL":
      return {
        draft: action.payload,
        applied: action.payload,
      };

    default:
      throw new Error("Invalid filter action");
  }
}
