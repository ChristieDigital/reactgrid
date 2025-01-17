import { State } from '../Model/State';
import { Compatible, Cell } from '../Model/PublicModel';
import { ClipboardEvent } from '../Model/domEventsTypes';
import { getActiveSelectedRange } from './getActiveSelectedRange';
import { pasteData } from './pasteData';

export function handlePaste(event: ClipboardEvent, state: State): State {
    const activeSelectedRange = getActiveSelectedRange(state);
    if (!activeSelectedRange) {
      return state;
    }
    let pastedRows: Compatible<Cell>[][] = [];
    const htmlData = event.clipboardData.getData("text/html");
    const document = new DOMParser().parseFromString(htmlData, "text/html");
    // TODO Do we need selection mode here ?
    //const selectionMode = parsedData.body.firstElementChild && parsedData.body.firstElementChild.getAttribute('data-selection') as SelectionMode;
    // TODO quite insecure! maybe do some checks ?
    const hasReactGridAttribute =
      document.body.firstElementChild?.getAttribute("data-reactgrid") ===
      "reactgrid-content";
    if (
      !(state.props?.pastePlainTextOnly) &&
      hasReactGridAttribute &&
      document.body.firstElementChild?.firstElementChild
    ) {
      const tableRows =
        document.body.firstElementChild.firstElementChild.children;
      for (let ri = 0; ri < tableRows.length; ri++) {
        const row: Compatible<Cell>[] = [];
        for (let ci = 0; ci < tableRows[ri].children.length; ci++) {
          const rawData =
            tableRows[ri].children[ci].getAttribute("data-reactgrid");
          const data = rawData && JSON.parse(rawData);
          const text = tableRows[ri].children[ci].innerHTML;
          row.push(data ? data : { type: "text", text, value: parseFloat(text) });
        }
        pastedRows.push(row);
      }
    } else {
      pastedRows = event.clipboardData
        .getData("text/plain")
        .split("\n")
        .map((line: string) =>
          line
            .split("\t")
            .map((t) => ({ type: "text", text: t, value: parseFloat(t) }))
        );
      if (pastedRows[pastedRows.length - 1].length === 1 && pastedRows[pastedRows.length - 1][0].text === '') {
        // sometimes excel likes to leave a trailing newline
        pastedRows.pop();
      }
    }
    event.preventDefault();
    return { ...pasteData(state, pastedRows) };
  }
  