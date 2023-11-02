/*
Missimo workshop kit extension
*/


//% color="#87CEEB" weight=24 icon="\uf1b6"
namespace Missimo
{
    //% blockId=missimo_ultrasonic block="Ultraschall Distanz|Trigger %Trigger|Echo %Echo"
    //% color="#87CEEB"
    //% weight=100
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Ultraschall_Distanz(Trigger: DigitalPin, Echo: DigitalPin): number
    {
        // send trigger pulse
        pins.setPull(Trigger, PinPullMode.PullNone);
        pins.digitalWritePin(Trigger, 0);
        control.waitMicros(2);
        pins.digitalWritePin(Trigger, 1);
        control.waitMicros(15);
        pins.digitalWritePin(Trigger, 0);

        // read pulse and convert to cm
        let d = pins.pulseIn(Echo, PulseValue.High, 23200);
        return 
    }

    //% blockId=missimo_ultrasonic_robot block="Ultraschall_Distanz_Roboter"
    //% color="#87CEEB"
    //% weight=100
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=2
    export function Ultraschall_Distanz_Roboter(): number
    {
        let oldDist = Ultraschall_Distanz(8, 2);
        let avg = oldDist;
        for (let index = 0; index <= 10; index++)
        {
            let dist = Ultraschall_Distanz(8, 2);
            avg = (0.8 * oldDist) + (0.2 * dist);
            control.waitMicros(10);
        }
        return avg;
    }


}