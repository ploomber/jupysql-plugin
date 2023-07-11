import { render, screen } from "@testing-library/react";
import { DialogContent } from "../dialog";
import React from 'react'

test("Show DialogContent", () => {
    // render the component on virtual dom
    render(<DialogContent />);
    screen.debug()
});