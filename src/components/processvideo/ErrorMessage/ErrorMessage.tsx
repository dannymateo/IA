import { Card, CardBody } from "@nextui-org/react";

import { ErrorMessageProps } from "./types";

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-400/5">
      <CardBody className="flex gap-4 items-center p-6">
        <p className="text-red-400 font-medium">{message}</p>
      </CardBody>
    </Card>
  );
};