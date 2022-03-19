import React from "react";

const Lowerscore = () => {
    return (
        <>
        <table className="table-fixed border border-light-blue m-4">
            <thead>
                <tr>
                    <th className="border border-light-blue">Lower Section</th>
                    <th className="border border-light-blue">Player</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="border border-light-blue">3 of a Kind</td>
                    <td className="border border-light-blue">3</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">4 of a Kind</td>
                    <td className="border border-light-blue">4</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">Full House</td>
                    <td className="border border-light-blue">25</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">SM Straight</td>
                    <td className="border border-light-blue">30</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">LG Straight</td>
                    <td className="border border-light-blue">40</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">Yahtzee</td>
                    <td className="border border-light-blue">50</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">Chance</td>
                    <td className="border border-light-blue">?</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">Yahtzee Bonus</td>
                    <td className="border border-light-blue">100</td>
                </tr>
                <tr>
                    <td className="border border-light-blue">Lower Total</td>
                    <td className="border border-light-blue">Your total</td>
                </tr>
            </tbody>
        </table>
        </>
    )
}

export default Lowerscore