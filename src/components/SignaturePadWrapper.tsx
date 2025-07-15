"use client";

import React, { forwardRef } from "react";
// @ts-ignore
const SignatureCanvas = require("react-signature-canvas").default;

const SignaturePadWrapper = forwardRef<any, any>((props, ref) => (
  <SignatureCanvas ref={ref} {...props} />
));

export default SignaturePadWrapper; 